"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Mail, Shield } from "lucide-react";
import {
  useMemberGetAllMembers,
  useMemberResend,
  useMemberUpdateRole,
} from "@/services/member.api";
import { useParams } from "next/navigation";
import { MemberManagementModal } from "@/app/[locale]/business/[businessId]/settings/(components)/member-management-modal";
import { useState } from "react";
import { MemberRole } from "@/models/api/business/index.type";
import { showToast } from "@/helper/show-toast";
import { MemberStatus } from "@/models/api/member/index.type";
import { useRole } from "@/contexts/role-context";
import { useTranslations } from "next-intl";

export function MembersTable() {
  const { businessId } = useParams() as { businessId: string };
  const { data: dataMembers } = useMemberGetAllMembers(businessId);
  const members = dataMembers?.data?.data || [];
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const t = useTranslations("settings");
  const mUpdateRole = useMemberUpdateRole();
  const mResend = useMemberResend();

  const { access } = useRole();
  const { invite, edit, delete: deleteMember } = access.member;

  const isActionAble = invite || edit || deleteMember;

  const ROLES: Role[] = [
    {
      label: t("admin"),
      value: "Admin",
    },
    {
      label: t("member"),
      value: "Member",
    },
  ];

  const onInviteMember = () => {
    setIsMemberModalOpen(true);
  };

  const onChangeRole = async (id: string, role: MemberRole) => {
    try {
      const findMember = members.find((member) => member.id === id);
      if (findMember?.role === role) return;
      const res = await mUpdateRole.mutateAsync({
        businessId,
        formData: {
          memberId: id,
          role,
        },
      });
      showToast("success", res.data.responseMessage);
    } catch {}
  };

  const onResendInvite = async (id: string) => {
    try {
      const res = await mResend.mutateAsync({
        businessId,
        formData: {
          memberId: id,
        },
      });
      showToast("success", res.data.responseMessage);
    } catch {}
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardContent className="p-0">
          {/* Mobile list */}
          <div className="flex flex-col p-4 sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              {t("members")}
            </CardTitle>
            {invite && (
              <Button
                onClick={onInviteMember}
                className="w-full sm:w-auto text-white"
              >
                + {t("inviteMember")}
              </Button>
            )}
          </div>
          <div className="block lg:hidden p-4 space-y-3">
            {members
              ?.filter((member) => JOINED_STATUS.includes(member.status))
              .map((member) => (
                <div
                  key={member.id}
                  className="border rounded-lg p-3 bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={member.profile.image} />
                        <AvatarFallback className="text-xs bg-muted">
                          {member.profile.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-[200px]">
                            {member.profile.name}
                          </span>
                          {member.isYourself && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-800"
                            >
                              {t("you")}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground break-all">
                          {member.profile.email}
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 border-0 rounded-full flex-shrink-0"
                        >
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    {isActionAble && member.role !== "Owner" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            {member.role}
                            <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {ROLES.map((role) => (
                            <DropdownMenuItem
                              key={role.value}
                              onClick={() =>
                                onChangeRole(member.id, role.value)
                              }
                            >
                              {role.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : JOINED_STATUS.includes(member.status) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        {member.role}
                      </Button>
                    ) : null}
                    {member.status === "Pending" && isActionAble && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center"
                        onClick={() => onResendInvite(member.id)}
                      >
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {t("resendInvite")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium text-muted-foreground">
                    {t("name")}
                  </th>
                  <th className="p-4 font-medium text-muted-foreground">
                    {t("email")}
                  </th>
                  <th className="p-4 font-medium text-muted-foreground">
                    {t("role")}
                  </th>
                  <th className="p-4 font-medium text-muted-foreground">
                    {t("status")}
                  </th>
                  {isActionAble && (
                    <th className="p-4 font-medium text-muted-foreground">
                      {t("actions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {members
                  ?.filter((member) => JOINED_STATUS.includes(member.status))
                  .map((member) => (
                    <tr
                      key={member.id}
                      className="border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile.image} />
                            <AvatarFallback className="text-xs bg-muted">
                              {member.profile.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {member.profile.name}
                            </span>
                            {member.isYourself && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-800"
                              >
                                {t("you")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground break-all">
                        {member.profile.email}
                      </td>
                      <td className="p-4">
                        {isActionAble && member.role !== "Owner" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 font-normal"
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                {member.role}
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {ROLES.map((role) => (
                                <DropdownMenuItem
                                  key={role.value}
                                  onClick={() =>
                                    onChangeRole(member.id, role.value)
                                  }
                                >
                                  {role.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-normal"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            {member.role}
                          </Button>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 border-0 rounded-full"
                        >
                          {member.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {member.status === "Pending" && isActionAble && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onResendInvite(member.id)}
                            >
                              {t("resendInvite")}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <MemberManagementModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        businessIdFromProps={null}
      />
    </div>
  );
}

interface Role {
  label: string;
  value: "Admin" | "Member";
}

export const JOINED_STATUS: MemberStatus[] = ["Accepted", "Pending"];
